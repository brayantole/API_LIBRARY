import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Author, AuthorDTO } from "./authors.model";
import { AuthorsRepository } from "./authors.repository";

export class AuthorsService {
    private readonly authorsRepository = new AuthorsRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: AuthorDTO): Promise<Author> {
        const name = this.requireString(data?.name, "name");
        const nationality = this.requireString(data?.nationality, "nationality");
        const birthYear = data?.birthYear === undefined
            ? undefined
            : this.requirePositiveInteger(data.birthYear, "birthYear");

        const now = new Date();

        return this.authorsRepository.create({
            name,
            nationality,
            birthYear,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Author[]> {
        return this.authorsRepository.findAll();
    }

    async findById(id: string): Promise<Author> {
        const author = await this.authorsRepository.findById(this.toObjectId(id));
        if (!author) {
            throw new NotFoundError("Autor no encontrado");
        }
        return author;
    }

    async update(id: string, data: AuthorDTO): Promise<Author> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Author> = {};

        if (data.name !== undefined) changes.name = this.requireString(data.name, "name");
        if (data.nationality !== undefined) {
            changes.nationality = this.requireString(data.nationality, "nationality");
        }
        if (data.birthYear !== undefined) {
            changes.birthYear = this.requirePositiveInteger(data.birthYear, "birthYear");
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();

        const updated = await this.authorsRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Autor no encontrado");
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        if (await this.booksRepository.existsByAuthorId(objectId)) {
            throw new BadRequestError("No se puede eliminar un autor que tiene libros asociados");
        }
        const deleted = await this.authorsRepository.delete(objectId);
        if (!deleted) {
            throw new NotFoundError("Autor no encontrado");
        }
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private requirePositiveInteger(value: unknown, field: string): number {
        if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
            throw new BadRequestError(`El campo '${field}' debe ser un número entero positivo`);
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
