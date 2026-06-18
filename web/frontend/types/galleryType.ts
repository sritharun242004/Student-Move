export type TCategory = {
  _id: string;
  name: string;
  photos: TImage[];
};

export type TImage = string | File;
