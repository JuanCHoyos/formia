import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
}
