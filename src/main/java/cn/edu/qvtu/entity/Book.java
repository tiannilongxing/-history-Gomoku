package cn.edu.qvtu.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class Book {
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "GMT+8")
    private Date publishDate;
    private BigDecimal price;
    private Integer stockQuantity;
    private Integer status;
}