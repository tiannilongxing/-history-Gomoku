package cn.edu.qvtu.controller;
import cn.edu.qvtu.dao.StudentDao;
import cn.edu.qvtu.entity.Student;
import cn.edu.qvtu.util.ResponseEntity;
import org.apache.ibatis.annotations.Delete;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller//标记这个类是一个控制器类
public class StudentApi {
    //创建学生表的数据访问对象，然后调用方法操作数据库
    @Autowired//自动注入，框架会自动帮我们赋值
    private StudentDao studentDao;
    //将新生信息持久化存储至`student`表。
    @PostMapping("/student/add")
    @ResponseBody
    public ResponseEntity add(@RequestBody Student stu) {
        //调用 数据访问对象的 添加方法
        int result = studentDao.addStudent(stu);
        //这里就不做相关逻辑验证（这部分你们自己做），我们直接输出 影响行数。
        return ResponseEntity.success("添加结果", stu);
    }

    //更新学生信息
    @PostMapping("/student/update")
    @ResponseBody
    public ResponseEntity update(@RequestBody Student stu) {
        //调用 数据访问对象的 更新方法
        int result = studentDao.updateStudent(stu);
        return ResponseEntity.success("更新结果", stu);
    }

    //删除学生信息
    @DeleteMapping("/student/delete/{stuId}")
    @ResponseBody
    public ResponseEntity delete(@PathVariable("stuId") String stuid) {
        //调用 数据访问对象的 删除方法
        int result = studentDao.deleteStudent(stuid);
        return ResponseEntity.success("删除结果", result);
    }

    //查询学生列表
    @GetMapping("/student/list")
    @ResponseBody
    public ResponseEntity list() {
        //调用 数据访问对象的 查询列表方法
        return ResponseEntity.success("查询结果", studentDao.getStudents());
    }

    //查询学生信息
    @GetMapping("/student/get/{stuId}")
    @ResponseBody
    public ResponseEntity query(@PathVariable("stuId") String stuid) {
        Student stu = studentDao.getStudent(stuid);
        return ResponseEntity.success("查询结果", stu);
    }
}

