// response ko streamline krne ke liye....

class ApiResponse {
    constructor(
        statusCode,
        data,
        message= "Sucess"
    ){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}