package cn.edu.qvtu.dao;
import cn.edu.qvtu.entity.Student;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StudentDao {
    //添加学生、修改学生、删除学生、根据学号查询学生实体、查询全部学生集合
    int addStudent(Student student);
    int updateStudent(Student student);
    int deleteStudent(String stuid);
    Student getStudent(String stuid);
    List<Student> getStudents();
    int insertStudent(String stuid, String stuname);
}