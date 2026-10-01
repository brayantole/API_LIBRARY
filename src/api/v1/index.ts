import { Router } from "express";
import authorsRoutes from "../../modules/authors/authors.routes";
import booksRoutes from "../../modules/books/books.routes";

const router = Router();

router.use("/authors", authorsRoutes);
router.use("/books", booksRoutes);

export default router;
