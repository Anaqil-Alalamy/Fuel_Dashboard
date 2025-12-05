const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDnTkwpbgsnY_i60u3ZleNs1DL3vMdG3fYHMrr5rwVDqMb3GpgKH40Y-7WQsEzEAi-wDHwLaimN8NC/pub?gid=1871402380&single=true&output=csv";

export async function handleSheetData(_req: any, res: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(SHEET_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return res
        .status(response.status)
        .json({ error: `HTTP ${response.status}` });
    }

    const csv = await response.text();
    res.set("Content-Type", "text/csv");
    res.send(csv);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = errorMessage.includes("abort") ? 408 : 500;
    res.status(statusCode).json({
      error: "Failed to fetch sheet data",
      message: errorMessage,
    });
  }
}
