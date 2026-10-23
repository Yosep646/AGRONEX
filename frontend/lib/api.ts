export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export type Parcel = { id: string; name: string; latitude: number; longitude: number; area_ha: number | null; created_at: string };
export type Weather = { source: string; data: Record<string, Record<string, number | null>>; units?: unknown };

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || `Error HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
export async function getWeather(lat: number, lon: number, start: string, end: string): Promise<Weather> {
  const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), start, end });
  return parseResponse<Weather>(await fetch(`${API_URL}/api/environment/power?${params}`, { cache: "no-store" }));
}
export async function getParcels(token: string): Promise<Parcel[]> {
  return parseResponse<Parcel[]>(await fetch(`${API_URL}/api/parcels`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }));
}
export async function addParcel(token: string, input: { name: string; latitude: number; longitude: number; area_ha?: number }) {
  const result = await parseResponse<Parcel[]>(await fetch(`${API_URL}/api/parcels`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input) }));
  return result[0];
}
