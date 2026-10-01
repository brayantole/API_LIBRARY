import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Loan } from "./loans.model";

export class LoansRepository {
    private collection(): Collection<Loan> {
        return getDb().collection<Loan>("loans");
    }

    async create(data: Omit<Loan, "_id">): Promise<Loan> {
        const result = await this.collection().insertOne(data as Loan);
        return { _id: result.insertedId, ...data };
    }

    async findAll(): Promise<Loan[]> {
        return this.collection().find().sort({ createdAt: -1 }).toArray();
    }

    async findById(id: ObjectId): Promise<Loan | null> {
        return this.collection().findOne({ _id: id });
    }

    async update(id: ObjectId, changes: Partial<Loan>): Promise<Loan | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async markReturned(id: ObjectId, returnDate: Date): Promise<Loan | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id, returned: false },
            { $set: { returned: true, returnDate, updatedAt: returnDate } },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async restoreActive(id: ObjectId): Promise<void> {
        await this.collection().updateOne(
            { _id: id, returned: true },
            {
                $set: { returned: false, updatedAt: new Date() },
                $unset: { returnDate: "" },
            }
        );
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}