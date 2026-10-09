import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Genres, GenresDTO } from "./genres.model";
import { GenresRepository } from "./genres.repository";

export class GenresService {
    private readonly genresRepository = new GenresRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: GenresDTO): Promise<Genres> {
        const name = this.requireString(data?.name, "name");
        const description = data?.description === undefined
            ? undefined
            : this.requireString(data.description, "description");
        const now = new Date();

        return this.genresRepository.create({
            name,
            description,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Genres[]> {
        return this.genresRepository.findAll();
    }

    async findById(id: string): Promise<Genres> {
        const genre = await this.genresRepository.findById(this.toObjectId(id));
        if (!genre) {
            throw new NotFoundError("Género no encontrado");
        }
        return genre;
    }

    async update(id: string, data: GenresDTO): Promise<Genres> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Genres> = {};

        if (data.name !== undefined) changes.name = this.requireString(data.name, "name");
        if (data.description !== undefined) {
            changes.description = this.requireString(data.description, "description");
        }
        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();
        const updated = await this.genresRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Género no encontrado");
        }
        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        if (!await this.genresRepository.findById(objectId)) {
            throw new NotFoundError("Género no encontrado");
        }
        if (await this.booksRepository.existsByGenreId(objectId)) {
            throw new BadRequestError("No se puede eliminar un género que tiene libros asociados");
        }
        if (!await this.genresRepository.delete(objectId)) {
            throw new NotFoundError("Género no encontrado");
        }
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}
