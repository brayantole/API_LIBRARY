import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Book, BookWithAuthorAndGenre } from "./books.model";

export class BooksRepository {
    private collection(): Collection<Book> {
        return getDb().collection<Book>("books");
    }

    async create(data: Omit<Book, "_id">): Promise<Book> {
        const result = await this.collection().insertOne(data as Book);
        return { _id: result.insertedId, ...data };
    }

    private relationLookupStages(): object[] {
        return [
            {
                $lookup: {
                    from: "authors",
                    localField: "authorId",
                    foreignField: "_id",
                    as: "author",
                },
            },
            {
                $unwind: {
                    path: "$author",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "genres",
                    localField: "genreId",
                    foreignField: "_id",
                    as: "genre",
                },
            },
            {
                $unwind: {
                    path: "$genre",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: { authorId: 0 },
            },
            {
                $project: { genreId: 0 },
            },
        ];
    }

    async findAllWithAuthor(): Promise<BookWithAuthorAndGenre[]> {
        return this.collection()
            .aggregate<BookWithAuthorAndGenre>([
                ...this.relationLookupStages(),
                { $sort: { createdAt: -1 } },
            ])
            .toArray();
    }

    async findByIdWithAuthor(id: ObjectId): Promise<BookWithAuthorAndGenre | null> {
        const result = await this.collection()
            .aggregate<BookWithAuthorAndGenre>([
                { $match: { _id: id } },
                ...this.relationLookupStages(),
            ])
            .toArray();
        return result[0] ?? null;
    }

    async findById(id: ObjectId): Promise<Book | null> {
        return this.collection().findOne({ _id: id });
    }

    async isbnExists(isbn: string, exceptId?: ObjectId): Promise<boolean> {
        const filter = exceptId ? { isbn, _id: { $ne: exceptId } } : { isbn };
        return (await this.collection().findOne(filter, { projection: { _id: 1 } })) !== null;
    }

    async existsByAuthorId(authorId: ObjectId): Promise<boolean> {
        return (await this.collection().findOne(
            { authorId },
            { projection: { _id: 1 } }
        )) !== null;
    }

    async existsByGenreId(genreId: ObjectId): Promise<boolean> {
        return (await this.collection().findOne(
            { genreId },
            { projection: { _id: 1 } }
        )) !== null;
    }

    async setAvailability(
        id: ObjectId,
        available: boolean,
        expectedAvailability: boolean
    ): Promise<boolean> {
        const result = await this.collection().updateOne(
            { _id: id, available: expectedAvailability },
            { $set: { available, updatedAt: new Date() } }
        );
        return result.modifiedCount === 1;
    }

    async update(id: ObjectId, changes: Partial<Book>): Promise<Book | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}