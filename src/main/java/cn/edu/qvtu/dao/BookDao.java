package cn.edu.qvtu.dao;

import cn.edu.qvtu.entity.Book;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BookDao {


    int insert(Book book);
    int update(Book book);
    int delete(String isbn);
    Book selectByIsbn(String isbn);
    List<Book> selectAll();
    List<Book> selectByTitle(@Param("keyword") String keyword);

    int countByIsbn(String isbn);
}