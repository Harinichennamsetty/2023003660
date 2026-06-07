const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoY2hhbm5hbUBnaXRhbS5pbiIsImV4cCI6MTc4MDgxMDU0NiwiaWF0IjoxNzgwODA5NjQ2LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNjUyZjFlZTAtZDExNC00MjBjLTgyMGYtNWY3NGM3NDFmMGU0IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiaGFyaW5pIiwic3ViIjoiMTY1YWZkNTYtMWRiNS00NWZmLWEwZTItZTIxYjkyYjkxNzMzIn0sImVtYWlsIjoiaGNoYW5uYW1AZ2l0YW0uaW4iLCJuYW1lIjoiaGFyaW5pIiwicm9sbE5vIjoiMjAyMzAwMzY2MCIsImFjY2Vzc0NvZGUiOiJ3Z0t0Z1oiLCJjbGllbnRJRCI6IjE2NWFmZDU2LTFkYjUtNDVmZi1hMGUyLWUyMWI5MmI5MTczMyIsImNsaWVudFNlY3JldCI6InJTUnloeW1TRGJoU3pNSlIifQ.MF3NVZkDTRydc2KPxgbMLrzUJiOyBGSo9x33RtMPEDg";

export async function Log(stack, level, packageName, message) {
  try {
    const response = await fetch(
      "http://4.224.186.213/evaluation-service/logs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          stack,
          level,
          package: packageName,
          message
        })
      }
    );

    const data = await response.json();
    console.log("Log Success:", data);

    return data;
  } catch (error) {
    console.error("Log Error:", error);
  }
}