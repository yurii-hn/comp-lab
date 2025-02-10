import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'src/app/app.component';
import { appConfig } from 'src/app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((error: unknown): void =>
    console.error(error),
);
