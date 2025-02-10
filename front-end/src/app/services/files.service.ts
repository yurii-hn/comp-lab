import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FilesService {
    public downloadFileWithData(
        data: unknown,
        filename: string,
    ): Observable<void | Error> {
        return new Observable<void>((observer: Observer<void>): void => {
            try {
                const dataString: string = JSON.stringify(data, null, 4);

                const blob: Blob = new Blob([dataString], {
                    type: 'application/json',
                });

                const url: string = URL.createObjectURL(blob);

                const anchor: HTMLAnchorElement = document.createElement('a');
                anchor.href = url;
                anchor.download = filename;

                anchor.click();

                URL.revokeObjectURL(url);
                anchor.remove();

                observer.next();
                observer.complete();
            } catch (error) {
                observer.error(error);
            }
        });
    }

    public readDataFromFile<DataType = unknown>(
        fileExtension: string,
    ): Observable<DataType> {
        return new Observable<DataType>(
            (observer: Observer<DataType>): void => {
                try {
                    const fileInput: HTMLInputElement =
                        document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = fileExtension;

                    fileInput.addEventListener('change', (): void =>
                        this.handleFileInput(fileInput, observer),
                    );

                    fileInput.click();
                    fileInput.remove();
                } catch (error) {
                    observer.error(error);
                }
            },
        );
    }

    private handleFileInput<DataType>(
        fileInput: HTMLInputElement,
        observer: Observer<DataType>,
    ): void {
        try {
            const file: File = fileInput.files![0];
            const fileReader: FileReader = new FileReader();

            fileReader.addEventListener('load', (): void =>
                this.handleFileLoad(fileReader, observer),
            );

            fileReader.addEventListener('abort', (): void =>
                observer.complete(),
            );

            fileReader.readAsText(file);
        } catch (error) {
            observer.error(error);
        }
    }

    private handleFileLoad<DataType>(
        fileReader: FileReader,
        observer: Observer<DataType>,
    ): void {
        try {
            const data: DataType = JSON.parse(fileReader.result as string);

            observer.next(data);
            observer.complete();
        } catch (error) {
            observer.error(error);
        }
    }
}
