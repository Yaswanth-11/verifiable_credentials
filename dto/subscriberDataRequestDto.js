export class SubscriberRequestDTO {
  constructor(serviceMethod, requestBody) {
    this.serviceMethod = serviceMethod;
    this.requestBody = requestBody;
  }
}

export class SubscriberRequestBody {
  constructor(selfieRequired, suid) {
    this.selfieRequired = selfieRequired;
    this.suid = suid;
  }
}

export class HolderRequestBody {
  constructor(suid) {
    this.suid = suid;
  }
}
