package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.BookDao;
import cn.edu.qvtu.entity.Book;
import cn.edu.qvtu.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 图书服务实现类
 */
@Service
@Transactional
public class BookServiceImpl implements BookService {

    @Autowired
    private BookDao bookDao;

    @Override
    public int addBook(Book book) {
        // 检查ISBN是否已存在
        if (isIsbnExists(book.getIsbn())) {
            throw new RuntimeException("ISBN已存在: " + book.getIsbn());
        }

        // 参数校验
        validateBookParameters(book);

        // 设置默认值
        if (book.getStockQuantity() == null) {
            book.setStockQuantity(0);
        }

        return bookDao.insert(book);
    }

    @Override
    public int updateBook(Book book) {
        // 检查图书是否存在
        Book existingBook = getBookByIsbn(book.getIsbn());
        if (existingBook == null) {
            throw new RuntimeException("图书不存在，ISBN: " + book.getIsbn());
        }

        // 参数校验
        validateBookParameters(book);

        return bookDao.update(book);
    }

    @Override
    public int deleteBook(String isbn) {
        // 检查图书是否存在
        Book existingBook = getBookByIsbn(isbn);
        if (existingBook == null) {
            throw new RuntimeException("图书不存在，ISBN: " + isbn);
        }

        return bookDao.delete(isbn);
    }

    @Override
    @Transactional(readOnly = true)
    public Book getBookByIsbn(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) {
            throw new RuntimeException("ISBN不能为空");
        }
        return bookDao.selectByIsbn(isbn);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookDao.selectAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> searchBooksByTitle(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new RuntimeException("搜索关键词不能为空");
        }
        return bookDao.selectByTitle(keyword);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isIsbnExists(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) {
            return false;
        }
        return bookDao.countByIsbn(isbn) > 0;
    }

    /**
     * 验证图书参数
     * @param book 图书对象
     */
    private void validateBookParameters(Book book) {
        if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
            throw new RuntimeException("ISBN不能为空");
        }
        if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
            throw new RuntimeException("书名不能为空");
        }
        if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
            throw new RuntimeException("作者不能为空");
        }
        if (book.getStatus() == null) {
            throw new RuntimeException("状态不能为空");
        }
        // 验证状态值是否有效
        if (book.getStatus() != 0 && book.getStatus() != 1) {
            throw new RuntimeException("状态值无效，只能是0或1");
        }
        // 验证库存数量不能为负数
        if (book.getStockQuantity() != null && book.getStockQuantity() < 0) {
            throw new RuntimeException("库存数量不能为负数");
        }
        // 验证价格不能为负数
        if (book.getPrice() != null && book.getPrice().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new RuntimeException("价格不能为负数");
        }
    }
}