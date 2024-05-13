import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IModel } from '@core/types/model.types';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SamplesService {
    constructor(private readonly httpClient: HttpClient) {}

    public getSample(name: string): Observable<IModel> {
        return this.httpClient.get<IModel>(`/assets/samples/${name}.json`, {
            responseType: 'json',
        });
    }
}
