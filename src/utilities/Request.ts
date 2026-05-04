import axios from 'axios';

export function newAxiosInstance() {
  // By default, axios treats status codes outside the range of 200-299 as errors.
  // However, for our use case, we want to consider any status code from 200 to 499 as a valid response,
  const validateStatus = (status: number) => status >= 200 && status <= 499;

  return axios.create({
    validateStatus,
  });
}
