import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SamplesService {
    private readonly httpClient: HttpClient = inject(HttpClient);

    public getSample<DataType>(path: string): Observable<DataType> {
        return this.httpClient.get<DataType>(`/assets/samples/${path}`, {
            responseType: 'json',
        });
    }
}
