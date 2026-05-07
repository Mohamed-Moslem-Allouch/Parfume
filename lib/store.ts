export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Sary Parfume",
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Tunis, Tunisia",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "+216 00 000 000",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "contact@saryparfume.com",
  deliveryFee: Number(process.env.NEXT_PUBLIC_DELIVERY_FEE_TND || "7"),
  lat: 36.836005,
  lng: 10.107389
};
