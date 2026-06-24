export async function createBooking(input: {
  astrologerId?: string;
  mode: "chat" | "audio" | "video";
}) {
  return {
    success: true,
    data: {
      bookingId: `local-${Date.now()}`,
      status: "PENDING",
      ...input
    }
  };
}
