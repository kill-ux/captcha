import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsoluteUrl =
    req.url.startsWith("http://") ||
    req.url.startsWith("https://")

  const startWithApi = req.url.startsWith("/api")

  if (isAbsoluteUrl || !startWithApi) {
    return next(req)
  }

  return next(req.clone({ url: `${environment.apiUrl}${req.url}` }))
}
