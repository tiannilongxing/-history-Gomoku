package cn.edu.qvtu.common.util;

public class ResponseEntity<T> {
    private boolean state;
    private String msg;
    private T data;

    public static <T> ResponseEntity<T> success(String msg, T data) {
        ResponseEntity<T> response = new ResponseEntity<>();
        response.setState(true);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static <T> ResponseEntity<T> error(String msg) {
        ResponseEntity<T> response = new ResponseEntity<>();
        response.setState(false);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // getter和setter
    public boolean isState() {
        return state;
    }

    public void setState(boolean state) {
        this.state = state;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}


