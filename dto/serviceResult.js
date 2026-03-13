export class ServiceResult {
    constructor(success, message, errorCode, errorMessage, result) {
        this.Success = success;
        this.Message = message;
        this.ErrorCode = errorCode;
        this.ErrorMessage = errorMessage;
        this.Result = result;
    }
}