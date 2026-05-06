package cn.edu.qvtu.service;

import cn.edu.qvtu.entity.Book;
import org.springframework.stereotype.Service;

import java.util.List;
public interface BookService {
    int addBook(Book book);
    int updateBook(Book book);
    int deleteBook(String isbn);
    Book getBookByIsbn(String isbn);
    List<Book> getAllBooks();
    List<Book> searchBooksByTitle(String keyword);
    boolean isIsbnExists(String isbn);
}