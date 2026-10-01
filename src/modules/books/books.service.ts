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
        const authorId = await this.requireAuthor(data?.authorId);
        const year = data?.year === undefined ? undefined : this.requireYear(data.year);
        await this.ensureUniqueIsbn(isbn);
        const now = new Date();

        try {
            return await this.booksRepository.create({
                title,
                isbn,
                authorId,
                year,
                available: true,
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
            this.rethrowDuplicateIsbn(error);
            throw error;
        }
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
        if (data.isbn !== undefined) {
            changes.isbn = this.requireString(data.isbn, "isbn");
            await this.ensureUniqueIsbn(changes.isbn, objectId);
        }
        if (data.authorId !== undefined) {
            changes.authorId = await this.requireAuthor(data.authorId);
        }
        if (data.year !== undefined) {
            changes.year = this.requireYear(data.year);
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();
        let updated: Book | null;
        try {
            updated = await this.booksRepository.update(objectId, changes);
        } catch (error) {
            this.rethrowDuplicateIsbn(error);
            throw error;
        }
        if (!updated) {
            throw new NotFoundError("Libro no encontrado");
        }
        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        const book = await this.booksRepository.findById(objectId);
        if (!book) {
            throw new NotFoundError("Libro no encontrado");
        }
        if (!book.available) {
            throw new BadRequestError("No se puede eliminar un libro que está prestado");
        }
        const deleted = await this.booksRepository.delete(objectId);
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
            throw new BadRequestError("El campo 'year' debe ser un número entero");
        }
        return value;
    }

    private async ensureUniqueIsbn(isbn: string, exceptId?: ObjectId): Promise<void> {
        if (await this.booksRepository.isbnExists(isbn, exceptId)) {
            throw new BadRequestError("El ISBN ya está registrado");
        }
    }

    private rethrowDuplicateIsbn(error: unknown): void {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new BadRequestError("El ISBN ya está registrado");
        }
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}