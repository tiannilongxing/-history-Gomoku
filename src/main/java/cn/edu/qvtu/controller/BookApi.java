package cn.edu.qvtu.controller;

import cn.edu.qvtu.entity.Book;
import cn.edu.qvtu.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/books")
public class BookApi {

    @Autowired
    private BookService bookService;

//错误类型+原因
    @PostMapping
    public ResponseEntity<Map<String, Object>> addBook(@RequestBody Book book) {
        try {
            if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("ISBN不能为空"));
            }
            if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("书名不能为空"));
            }
            if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("作者不能为空"));
            }
            if (book.getStatus() == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("状态不能为空"));
            }

            if (book.getStockQuantity() == null) {
                book.setStockQuantity(0);
            }

            int result = bookService.addBook(book);
            if (result > 0) {
                return ResponseEntity.ok(createSuccessResponse("添加图书成功"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("添加图书失败"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("添加图书时发生错误: " + e.getMessage()));
        }
    }


    @PutMapping
    public ResponseEntity<Map<String, Object>> updateBook(@RequestBody Book book) {
        try {
            if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("ISBN不能为空"));
            }

            Book existingBook = bookService.getBookByIsbn(book.getIsbn());
            if (existingBook == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("图书不存在"));
            }

            int result = bookService.updateBook(book);
            if (result > 0) {
                return ResponseEntity.ok(createSuccessResponse("修改图书成功"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("修改图书失败"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("修改图书时发生错误: " + e.getMessage()));
        }
    }


    @DeleteMapping("/{isbn}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable String isbn) {
        try {
            if (isbn == null || isbn.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("ISBN不能为空"));
            }

            Book existingBook = bookService.getBookByIsbn(isbn);
            if (existingBook == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("图书不存在"));
            }

            int result = bookService.deleteBook(isbn);
            if (result > 0) {
                return ResponseEntity.ok(createSuccessResponse("删除图书成功"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("删除图书失败"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("删除图书时发生错误: " + e.getMessage()));
        }
    }


    @GetMapping("/{isbn}")
    public ResponseEntity<Map<String, Object>> getBookByIsbn(@PathVariable String isbn) {
        try {
            if (isbn == null || isbn.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("ISBN不能为空"));
            }

            Book book = bookService.getBookByIsbn(isbn);
            if (book != null) {
                Map<String, Object> response = createSuccessResponse("查询成功");
                response.put("data", book);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("图书不存在"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("查询图书时发生错误: " + e.getMessage()));
        }
    }


    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBooks() {
        try {
            List<Book> books = bookService.getAllBooks();
            Map<String, Object> response = createSuccessResponse("查询成功");
            response.put("data", books);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("查询图书列表时发生错误: " + e.getMessage()));
        }
    }


    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchBooksByTitle(@RequestParam String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("搜索关键词不能为空"));
            }

            List<Book> books = bookService.searchBooksByTitle(keyword);
            Map<String, Object> response = createSuccessResponse("搜索成功");
            response.put("data", books);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("搜索图书时发生错误: " + e.getMessage()));
        }
    }


    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("state", true);
        response.put("msg", message);
        return response;
    }


    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("state", false);
        response.put("msg", message);
        return response;
    }
}

