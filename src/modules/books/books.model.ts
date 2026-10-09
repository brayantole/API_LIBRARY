import { ObjectId } from "mongodb";
import { Author } from "../authors/authors.model";
import { Genres } from "../genres/genres.model";

export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;
    authorId: ObjectId;
    genreId: ObjectId;
    year?: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookDTO {
    title?: string;
    isbn?: string;
    authorId?: string;
    genreId?: string;
    year?: number;
}

export interface BookWithAuthorAndGenre extends Omit<Book, "authorId" | "genreId"> {
    author: Author | null;
    genre: Genres | null;
}