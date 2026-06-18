export type TSocial = {
  platform:
    | "Facebook"
    | "Linkedin"
    | "Instagram"
    | "Whatsapp"
    | "X"
    | "Youtube";
  url: string;
};

export type Profile = {
  themeNo: number;
  displayName: string;
  title: string;
  companyName: string;
  bio: string;
  profileImage: string;
  coverImage?: string;
  mobileNumber: string;
  email: string;
  address: string;
  website: string;
  socialMedia: TSocial[];
  user: string;
  profileType: "StandardProfile" | "PremiumProfile";
};
