// A single dropdown option returned by the common select endpoint.
// key   → the value stored in DB / sent in form payload  (e.g. "Homes")
// value → the label shown in the UI dropdown             (e.g. "Homes")
export interface KeyValueItem {
  key: string;
  value: string;
}

// Shape of the full HTTP response body from GET /api/common/select/:entity.
// Used as the generic T in HttpService.get<SelectItemsResponse>().
export interface SelectItemsResponse {
  isSuccess: boolean;
  result: {
    items: KeyValueItem[];
  };
}
