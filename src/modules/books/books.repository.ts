import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Book, BookWithAuthor } from "./books.model";

export class BooksRepository {
    private collection(): Collection<Book> {
        return getDb().collection<Book>("books");
    }

    async create(data: Omit<Book, "_id">): Promise<Book> {
        const result = await this.collection().insertOne(data as Book);
        return { _id: result.insertedId, ...data };
    }

    private authorLookupStages(): object[] {
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
                $project: { authorId: 0 },
            },
        ];
    }

    async findAllWithAuthor(): Promise<BookWithAuthor[]> {
        return this.collection()
            .aggregate<BookWithAuthor>([
                ...this.authorLookupStages(),
                { $sort: { createdAt: -1 } },
            ])
            .toArray();
    }

    async findByIdWithAuthor(id: ObjectId): Promise<BookWithAuthor | null> {
        const result = await this.collection()
            .aggregate<BookWithAuthor>([
                { $match: { _id: id } },
                ...this.authorLookupStages(),
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