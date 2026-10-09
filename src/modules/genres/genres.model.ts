import { ObjectId } from "mongodb";

export interface Genres {
    _id?: ObjectId;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GenresDTO {
    name?: string;
    description?: string;
}           