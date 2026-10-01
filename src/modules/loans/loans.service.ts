import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Loan, LoanDTO } from "./loans.model";
import { LoansRepository } from "./loans.repository";

export class LoansService {
    private readonly loansRepository = new LoansRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: LoanDTO): Promise<Loan> {
        const bookId = await this.requireBook(data?.bookId);
        const borrowerName = this.requireString(data?.borrowerName, "borrowerName");
        const loanDate = new Date();
        const dueDate = this.requireDate(data?.dueDate, "dueDate");
        this.requireDueDateAfterLoanDate(dueDate, loanDate);
        const now = new Date();

        return this.loansRepository.create({
            bookId,
            borrowerName,
            loanDate,
            dueDate,
            returnedAt: null,
            status: "active",
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Loan[]> {
        return this.loansRepository.findAll();
    }

    async findById(id: string): Promise<Loan> {
        const loan = await this.loansRepository.findById(this.toObjectId(id));
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        return loan;
    }

    async update(id: string, data: LoanDTO): Promise<Loan> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        if (loan.status === "returned") {
            throw new BadRequestError("No se puede actualizar un préstamo devuelto");
        }

        const changes: Partial<Loan> = {};
        if (data.bookId !== undefined) {
            changes.bookId = await this.requireBook(data.bookId);
        }
        if (data.borrowerName !== undefined) {
            changes.borrowerName = this.requireString(data.borrowerName, "borrowerName");
        }
        if (data.dueDate !== undefined) {
            changes.dueDate = this.requireDate(data.dueDate, "dueDate");
            this.requireDueDateAfterLoanDate(changes.dueDate, loan.loanDate);
        }
        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();
        const updated = await this.loansRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        return updated;
    }

    async returnLoan(id: string): Promise<Loan> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        if (loan.status === "returned") {
            throw new BadRequestError("El préstamo ya fue devuelto");
        }

        const now = new Date();
        const returned = await this.loansRepository.update(objectId, {
            status: "returned",
            returnedAt: now,
            updatedAt: now,
        });
        if (!returned) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        return returned;
    }

    async delete(id: string): Promise<void> {
        const deleted = await this.loansRepository.delete(this.toObjectId(id));
        if (!deleted) {
            throw new NotFoundError("Préstamo no encontrado");
        }
    }

    private async requireBook(id: unknown): Promise<ObjectId> {
        const bookId = this.toObjectId(this.requireString(id, "bookId"));
        if (!await this.booksRepository.findById(bookId)) {
            throw new NotFoundError("Libro no encontrado");
        }
        return bookId;
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private requireDate(value: unknown, field: string): Date {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser una fecha válida`);
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new BadRequestError(`El campo '${field}' debe ser una fecha válida`);
        }
        return date;
    }

    private requireDueDateAfterLoanDate(dueDate: Date, loanDate: Date): void {
        if (dueDate <= loanDate) {
            throw new BadRequestError("La fecha de vencimiento debe ser posterior a la fecha del préstamo");
        }
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}