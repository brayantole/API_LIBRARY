import { ObjectId } from "mongodb";

export type LoanStatus = "active" | "returned";

export interface Loan {
    _id?: ObjectId;
    bookId: ObjectId;
    borrowerName: string;
    loanDate: Date;
    dueDate: Date;
    returnedAt: Date | null;
    status: LoanStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoanDTO {
    bookId?: string;
    borrowerName?: string;
    dueDate?: string;
}