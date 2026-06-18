import Cookies from "js-cookie";

const COOKIE_NAME = "favorites";

export const getFavorites = (): number[] => {
  const cookie = Cookies.get(COOKIE_NAME);
  return cookie ? JSON.parse(cookie) : [];
};

export const addFavorite = (propertyId: number) => {
  const current = getFavorites();
  if (!current.includes(propertyId)) {
    Cookies.set(COOKIE_NAME, JSON.stringify([...current, propertyId]), {
      expires: 7,
    });
  }
};

export const removeFavorite = (propertyId: number) => {
  const current = getFavorites();
  const updated = current.filter((id) => id !== propertyId);
  Cookies.set(COOKIE_NAME, JSON.stringify(updated), { expires: 7 });
};

export const isFavorite = (propertyId: number): boolean => {
  return getFavorites().includes(propertyId);
};
