export class DistanceCalculator {
  private static readonly EARTH_RADIUS_KM = 6371;

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100;
  }

  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  static sortByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
    items: T[],
    userLat: number,
    userLon: number
  ): (T & { distance: number })[] {
    return items
      .filter(item => item.latitude && item.longitude)
      .map(item => ({
        ...item,
        distance: this.calculateDistance(
          userLat,
          userLon,
          item.latitude!,
          item.longitude!
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
