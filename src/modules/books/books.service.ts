import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { AuthorsRepository } from "../authors/authors.repository";
import { Book, BookDTO } from "./books.model";
import { BooksRepository } from "./books.repository";

export class BooksService {
    private readonly booksRepository = new BooksRepository();
    private readonly authorsRepository = new AuthorsRepository();

    async create(data: BookDTO): Promise<Book> {
        const title = this.requireString(data?.title, "title");
        const isbn = this.requireString(data?.isbn, "isbn");
        const genre = this.requireString(data?.genre, "genre");
        const publicationYear = this.requireYear(data?.publicationYear);
        const authorId = await this.requireAuthor(data?.authorId);
        const now = new Date();

        return this.booksRepository.create({
            title,
            isbn,
            publicationYear,
            genre,
            authorId,
            active: typeof data.active === "boolean" ? data.active : true,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Book[]> {
        return this.booksRepository.findAll();
    }

    async findById(id: string): Promise<Book> {
        const book = await this.booksRepository.findById(this.toObjectId(id));
        if (!book) {
            throw new NotFoundError("Libro no encontrado");
        }
        return book;
    }

    async update(id: string, data: BookDTO): Promise<Book> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Book> = {};

        if (data.title !== undefined) changes.title = this.requireString(data.title, "title");
        if (data.isbn !== undefined) changes.isbn = this.requireString(data.isbn, "isbn");
        if (data.genre !== undefined) changes.genre = this.requireString(data.genre, "genre");
        if (data.publicationYear !== undefined) {
            changes.publicationYear = this.requireYear(data.publicationYear);
        }
        if (data.authorId !== undefined) {
            changes.authorId = await this.requireAuthor(data.authorId);
        }
        if (data.active !== undefined) {
            if (typeof data.active !== "boolean") {
                throw new BadRequestError("El campo 'active' debe ser booleano");
            }
            changes.active = data.active;
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();
        const updated = await this.booksRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Libro no encontrado");
        }
        return updated;
    }

    async delete(id: string): Promise<void> {
        const deleted = await this.booksRepository.delete(this.toObjectId(id));
        if (!deleted) {
            throw new NotFoundError("Libro no encontrado");
        }
    }

    private async requireAuthor(id: unknown): Promise<ObjectId> {
        const authorId = this.toObjectId(this.requireString(id, "authorId"));
        if (!await this.authorsRepository.findById(authorId)) {
            throw new NotFoundError("Autor no encontrado");
        }
        return authorId;
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private requireYear(value: unknown): number {
        if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new BadRequestError("El campo 'publicationYear' debe ser un número entero");
        }
        if (value < 0 || value > new Date().getFullYear()) {
            throw new BadRequestError(`El campo 'publicationYear' debe estar entre 0 y ${new Date().getFullYear()}`);
        }
        return value;
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}