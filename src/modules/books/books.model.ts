import { ObjectId } from "mongodb";

export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;
    publicationYear: number;
    genre: string;
    authorId: ObjectId;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookDTO {
    title?: string;
    isbn?: string;
    publicationYear?: number;
    genre?: string;
    authorId?: string;
    active?: boolean;
}