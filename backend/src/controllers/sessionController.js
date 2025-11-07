import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user._clerkId;

    if (!problem || difficulty) {
      return res
        .status(400)
        .json({ message: "Problem and difficulty are required" });
    }

    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });
    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.error("Error in createSession controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = (
      await Session.find({ status: "active" }).populate(
        "host",
        "name profileImage email clerkId"
      )
    )
      .toSorted({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getActiveSessions controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getMyRecentSessions controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ msg: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in getSessionsById controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user._clerkId;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ msg: "Session not found" });

    if (session.status !== "active")
      return res.status(400).json({ msg: "Cannot join a Completed Session" });

    if (session.host.toString() === userId.toString())
      return res
        .status(400)
        .json({ msg: "Host cannot join their own session as participant" });

    if (session.participant)
      return res.status(400).json({ msg: "Session is full" });

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in joinSession controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    if (session.host.toString() !== userId.toString())
      return res.status(403).json({ msg: "Only host can end the session" });

    if (session.status === "completed") {
      return res.status(400).json({ msg: "Session is already ended" });
    }

    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    return res.status(200).json({ session });
  } catch (error) {
    console.error("Error in endSession controller", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}
