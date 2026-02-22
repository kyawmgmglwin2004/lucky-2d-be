class StatusCode {

  static OK(message = "No Error", data = null) {
    return {
      code: 200,
      status: "OK",
      message,
      ...(data && { data })
    };
  }

  static SEE_OTHER(url, message = "Please follow the URL provided") {
    return {
      code: 303,
      status: "SEE_OTHER",
      message,
      ...(url && { url })
    };
  }

  static INVALID_ARGUMENT(message = "Client specified an invalid argument") {
    return {
      code: 400,
      status: "INVALID_ARGUMENT",
      message
    };
  }

  static UNAUTHENTICATED(message = "Request is not authenticated") {
    return {
      code: 401,
      status: "UNAUTHENTICATED",
      message
    };
  }

  static PERMISSION_DENIED(message = "Permission denied") {
    return {
      code: 403,
      status: "PERMISSION_DENIED",
      message
    };
  }

  static NOT_FOUND(message = "A specified resource is not found") {
    return {
      code: 404,
      status: "NOT_FOUND",
      message
    };
  }

  static UNKNOWN(message = "Unknown Server Error") {
    return {
      code: 500,
      status: "UNKNOWN",
      message
    };
  }

}

export default StatusCode;