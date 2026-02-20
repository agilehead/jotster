export type ZulipSuccessResponse = {
  readonly result: "success";
  readonly msg: "";
};

export type ZulipErrorResponse = {
  readonly result: "error";
  readonly msg: string;
  readonly code?: string;
};

export type ZulipResponse = ZulipSuccessResponse | ZulipErrorResponse;
