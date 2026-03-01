import mongoose from "mongoose";
import { Contact, IContact } from "./models/Contact";

interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface IdentifyResponse {
  contact: {
    primaryContatctId: string;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: string[];
  };
}

export async function identify(req: IdentifyRequest): Promise<IdentifyResponse> {
  const emailVal = req.email?.trim() || null;
  const phoneVal = req.phoneNumber?.toString().trim() || null;

  if (!emailVal && !phoneVal) {
    throw new Error("At least one of email or phoneNumber is required");
  }

  // Build OR query for matching contacts
  const orConditions: object[] = [];
  if (emailVal) orConditions.push({ email: emailVal });
  if (phoneVal) orConditions.push({ phoneNumber: phoneVal });

  const matchedContacts = await Contact.find({
    deletedAt: null,
    $or: orConditions,
  });

  // No existing contacts → create new primary
  if (matchedContacts.length === 0) {
    const newContact = await Contact.create({
      email: emailVal,
      phoneNumber: phoneVal,
      linkedId: null,
      linkPrecedence: "primary",
    });

    return buildResponse(newContact._id.toString());
  }

  // Collect all primary IDs from matched contacts
  const primaryIds = new Set<string>();
  for (const c of matchedContacts) {
    if (c.linkPrecedence === "primary") {
      primaryIds.add(c._id.toString());
    } else if (c.linkedId) {
      primaryIds.add(c.linkedId.toString());
    }
  }

  // Fetch full clusters for all involved primaries
  const allClusters = await Contact.find({
    deletedAt: null,
    $or: [
      { _id: { $in: Array.from(primaryIds).map((id) => new mongoose.Types.ObjectId(id)) } },
      { linkedId: { $in: Array.from(primaryIds).map((id) => new mongoose.Types.ObjectId(id)) } },
    ],
  });

  // Deduplicate by ID
  const contactMap = new Map<string, IContact>();
  for (const c of allClusters) contactMap.set(c._id.toString(), c);
  const allContacts = Array.from(contactMap.values());

  // Find the oldest primary = true primary
  const primaries = allContacts
    .filter((c) => c.linkPrecedence === "primary")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const truePrimary = primaries[0];

  // Demote other primaries to secondary
  const demotedIds: string[] = [];
  for (const p of primaries.slice(1)) {
    demotedIds.push(p._id.toString());
    await Contact.findByIdAndUpdate(p._id, {
      linkPrecedence: "secondary",
      linkedId: truePrimary._id,
    });

    // Re-point their secondaries to the true primary
    await Contact.updateMany(
      { linkedId: p._id },
      { linkedId: truePrimary._id }
    );
  }

  // Check if incoming info is new (not already in the cluster)
  const clusterEmails = new Set(allContacts.map((c) => c.email).filter(Boolean));
  const clusterPhones = new Set(allContacts.map((c) => c.phoneNumber).filter(Boolean));

  const hasNewEmail = emailVal && !clusterEmails.has(emailVal);
  const hasNewPhone = phoneVal && !clusterPhones.has(phoneVal);

  if (hasNewEmail || hasNewPhone) {
    await Contact.create({
      email: emailVal,
      phoneNumber: phoneVal,
      linkedId: truePrimary._id,
      linkPrecedence: "secondary",
    });
  }

  return buildResponse(truePrimary._id.toString());
}

async function buildResponse(primaryId: string): Promise<IdentifyResponse> {
  const allContacts = await Contact.find({
    deletedAt: null,
    $or: [
      { _id: new mongoose.Types.ObjectId(primaryId) },
      { linkedId: new mongoose.Types.ObjectId(primaryId) },
    ],
  }).sort({ createdAt: 1 });

  const primary = allContacts.find((c) => c._id.toString() === primaryId)!;
  const secondaries = allContacts.filter((c) => c._id.toString() !== primaryId);

  const emails: string[] = [];
  const phones: string[] = [];

  if (primary.email) emails.push(primary.email);
  if (primary.phoneNumber) phones.push(primary.phoneNumber);

  for (const c of secondaries) {
    if (c.email && !emails.includes(c.email)) emails.push(c.email);
    if (c.phoneNumber && !phones.includes(c.phoneNumber)) phones.push(c.phoneNumber);
  }

  return {
    contact: {
      primaryContatctId: primaryId,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaries.map((c) => c._id.toString()),
    },
  };
}
