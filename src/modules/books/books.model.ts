import { ObjectId } from "mongodb";
import { Author } from "../authors/authors.model";
import { Genres } from "../genres/genres.model";

export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;
    authorId: ObjectId;
    genreIds: ObjectId[];
    year?: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookDTO {
    title?: string;
    isbn?: string;
    authorId?: string;
    genreIds?: string[];
    year?: number;
}

export interface BookWithAuthorAndGenres extends Book {
    author: Author | null;
    genres: Genres[];
}