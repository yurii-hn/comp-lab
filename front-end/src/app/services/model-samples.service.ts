import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IImportModel } from '@core/types/workspaces';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SamplesService {
    constructor(private readonly httpClient: HttpClient) {}

    public getSample(sampleName: string): Observable<IImportModel> {
        return this.httpClient.get<IImportModel>(
            `/assets/samples/${sampleName}.json`,
            {
                responseType: 'json',
            }
        );
    }
}
