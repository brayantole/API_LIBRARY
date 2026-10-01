import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Loan, LoanDTO, LoanUpdateDTO } from "./loans.model";
import { LoansRepository } from "./loans.repository";

export class LoansService {
    private readonly loansRepository = new LoansRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: LoanDTO): Promise<Loan> {
        const bookId = this.toObjectId(this.requireString(data?.bookId, "bookId"));
        const userName = this.requireString(data?.userName, "userName");
        const loanDate = this.requireDate(data?.loanDate, "loanDate");
        const book = await this.booksRepository.findById(bookId);
        if (!book) {
            throw new NotFoundError("Libro no encontrado");
        }
        if (!await this.booksRepository.setAvailability(bookId, false, true)) {
            throw new BadRequestError("El libro no está disponible para préstamo");
        }

        const now = new Date();
        try {
            return await this.loansRepository.create({
                bookId,
                userName,
                loanDate,
                returned: false,
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
            try {
                await this.booksRepository.setAvailability(bookId, true, false);
            } catch {
                // Keep the original insertion error if compensation also fails.
            }
            throw error;
        }
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

    async update(id: string, data: LoanUpdateDTO): Promise<Loan> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        if (loan.returned) {
            throw new BadRequestError("No se puede actualizar un préstamo devuelto");
        }
        if (data.returned !== undefined && typeof data.returned !== "boolean") {
            throw new BadRequestError("El campo 'returned' debe ser booleano");
        }

        const changes: Partial<Loan> = {};
        if (data.userName !== undefined) {
            changes.userName = this.requireString(data.userName, "userName");
        }
        if (data.loanDate !== undefined) {
            changes.loanDate = this.requireDate(data.loanDate, "loanDate");
        }
        const shouldReturn = data.returned === true;
        if (Object.keys(changes).length === 0 && !shouldReturn) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        let updated = loan;
        if (Object.keys(changes).length > 0) {
            changes.updatedAt = new Date();
            const result = await this.loansRepository.update(objectId, changes);
            if (!result) {
                throw new NotFoundError("Préstamo no encontrado");
            }
            updated = result;
        }
        return shouldReturn ? this.returnLoan(objectId) : updated;
    }

    private async returnLoan(objectId: ObjectId): Promise<Loan> {
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        if (loan.returned) {
            throw new BadRequestError("El préstamo ya fue devuelto");
        }

        const now = new Date();
        const returned = await this.loansRepository.markReturned(objectId, now);
        if (!returned) {
            const current = await this.loansRepository.findById(objectId);
            if (!current) throw new NotFoundError("Préstamo no encontrado");
            throw new BadRequestError("El préstamo ya fue devuelto");
        }
        if (!await this.booksRepository.setAvailability(loan.bookId, true, false)) {
            await this.loansRepository.restoreActive(objectId);
            const book = await this.booksRepository.findById(loan.bookId);
            if (!book) throw new NotFoundError("Libro no encontrado");
            throw new BadRequestError("El libro no figura como prestado");
        }
        return returned;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        if (!loan.returned) {
            await this.returnLoan(objectId);
        }
        const deleted = await this.loansRepository.delete(objectId);
        if (!deleted) {
            throw new NotFoundError("Préstamo no encontrado");
        }
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

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}