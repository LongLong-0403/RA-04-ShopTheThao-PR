"""Lỗi nghiệp vụ dùng chung cho tầng service.

Service chỉ cần `raise NotFoundError("...")`; main.py đã đăng ký handler để đổi
các lỗi này thành response JSON {"detail": "..."} với mã HTTP tương ứng.
Nhờ vậy service không phụ thuộc FastAPI và có thể gọi lại ở bất kỳ đâu.
"""


class ServiceError(Exception):
    status_code = 400

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


class BadRequestError(ServiceError):
    status_code = 400


class PermissionDeniedError(ServiceError):
    status_code = 403


class NotFoundError(ServiceError):
    status_code = 404


class ConflictError(ServiceError):
    status_code = 409
