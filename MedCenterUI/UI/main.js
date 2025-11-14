const patientNames = ['Иванов И.И.', 'Петрова А.С.', 'Сидоров В.В.', 'Кузнецова О.П.', 'Михайлов Д.Е.', 'Васильева Е.А.', 'Новиков С.Н.', 'Морозова И.В.'];
const doctorNames = ['Петров П.П.', 'Смирнова Л.И.', 'Волков А.Б.', 'Зайцева М.Г.'];
const specializations = ['Терапевт', 'Невролог', 'Хирург', 'Окулист'];
const descriptions = [
    'Плановый осмотр', 'Острая боль', 'Консультация по результатам анализов',
    'Вторичный прием', 'Оформление справки', 'Процедура', 'Жалобы на самочувствие'
];
const statuses = ['Запланирован', 'Завершен', 'Отменен'];


const appointments = [];
for (let i = 1; i <= 20; i++) {
    const creationDate = new Date(2025, 10, i, 10 + i, 30 * (i % 2), 0);
    const appointmentDate = new Date(creationDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    appointments.push({
        id: i.toString(),
        description: descriptions[i % descriptions.length],
        createdAt: creationDate,
        author: patientNames[i % patientNames.length],
        photoLink: null,


        patientId: (i % patientNames.length) + 1,
        doctorId: (i % doctorNames.length) + 1,
        appointmentDate: appointmentDate,
        status: statuses[i % statuses.length],
        specialization: specializations[i % specializations.length]
    });
}

console.log('Исходный массив данных (приемов):', appointments);


class AppointmentCollection {
    _appointments = [];

    constructor(initialAppointments = []) {
        this.addAll(initialAppointments);
    }
    _validateAppointment(app) {
        if (!app) return false;

        const hasRequiredFields = app.id && app.description && app.createdAt && app.author &&
                                  app.patientId && app.doctorId && app.appointmentDate && app.status;
        if (!hasRequiredFields) {
            console.error('Ошибка валидации: отсутствуют обязательные поля.', app);
            return false;
        }

        if (typeof app.id !== 'string' || app.id.length === 0) return false;
        if (typeof app.description !== 'string' || app.description.length >= 200) return false;
        if (!(app.createdAt instanceof Date)) return false;
        if (!(app.appointmentDate instanceof Date)) return false;
        if (typeof app.author !== 'string' || app.author.length === 0) return false;
        if (app.photoLink && typeof app.photoLink !== 'string') return false; // photoLink не обязателен

        return true;
    }

    getObjs(skip = 0, top = 10, filterConfig = {}) {
        let result = [...this._appointments];

        if (filterConfig.author) {
            result = result.filter(app => app.author.toLowerCase().includes(filterConfig.author.toLowerCase()));
        }
        if (filterConfig.status) {
            result = result.filter(app => app.status === filterConfig.status);
        }
        if (filterConfig.specialization) {
            result = result.filter(app => app.specialization === filterConfig.specialization);
        }
        if (filterConfig.dateFrom && filterConfig.dateTo) {
             result = result.filter(app => app.appointmentDate >= filterConfig.dateFrom && app.appointmentDate <= filterConfig.dateTo);
        }

        result.sort((a, b) => b.createdAt - a.createdAt);

        return result.slice(skip, skip + top);
    }

    getObj(id) {
        if (typeof id !== 'string') return undefined;
        return this._appointments.find(app => app.id === id);
    }

    validateObj(app) {
        return this._validateAppointment(app);
    }

    addObj(app) {
        if (!this._validateAppointment(app) || this.getObj(app.id)) {
            return false;
        }
        this._appointments.push(app);
        return true;
    }

    editObj(id, changes) {
        if (typeof id !== 'string' || !changes) return false;

        const index = this._appointments.findIndex(app => app.id === id);
        if (index === -1) {
            return false;
        }

        delete changes.id;
        delete changes.author;
        delete changes.createdAt;

        const updatedAppointment = { ...this._appointments[index], ...changes };

        if (!this._validateAppointment(updatedAppointment)) {
            return false;
        }

        this._appointments[index] = updatedAppointment;
        return true;
    }

    removeObj(id) {
        if (typeof id !== 'string') return false;

        const index = this._appointments.findIndex(app => app.id === id);
        if (index === -1) {
            return false;
        }

        this._appointments.splice(index, 1);
        return true;
    }

    addAll(apps) {
        const successfullyAdded = [];
        if (!Array.isArray(apps)) return successfullyAdded;

        apps.forEach(app => {
            if (this.addObj(app)) {
                successfullyAdded.push(app);
            }
        });
        return successfullyAdded;
    }

    clear() {
        this._appointments = [];
    }
}


const appointmentService = new AppointmentCollection(appointments);

console.log("--- Проверка работы методов ---");
console.log("\n1. getObjs(): первые 5 приемов (по умолчанию 10)");
console.table(appointmentService.getObjs(0, 5));

console.log("\n2. getObjs(): следующие 5 приемов (пагинация)");
console.table(appointmentService.getObjs(5, 5));

console.log("\n3. getObjs(): фильтр по статусу 'Завершен'");
console.table(appointmentService.getObjs(0, 5, { status: 'Завершен' }));

console.log("\n4. getObjs(): фильтр по автору 'Иванов'");
console.table(appointmentService.getObjs(0, 5, { author: 'Иванов' }));

console.log("\n5. getObj(): найти прием с id='5' (успешно)");
console.log(appointmentService.getObj('5'));

console.log("\n6. getObj(): найти прием с id='99' (неуспешно)");
console.log(appointmentService.getObj('99'));

const newAppointmentValid = {
    id: '21', description: 'Новый тестовый прием', createdAt: new Date(), author: 'Тестов Т.Т.',
    patientId: 99, doctorId: 100, appointmentDate: new Date(), status: 'Запланирован', specialization: 'Терапевт'
};
console.log("\n7. addObj(): добавить валидный прием (ожидаем true):", appointmentService.addObj(newAppointmentValid));
console.log("Проверяем, что прием с id=21 появился:", appointmentService.getObj('21'));

const newAppointmentInvalid = { id: '22', description: 'Невалидный' }; // нет обязательных полей
console.log("\n8. addObj(): добавить невалидный прием (ожидаем false):", appointmentService.addObj(newAppointmentInvalid));

console.log("\n9. editObj(): изменить статус у приема id='3' (ожидаем true):", appointmentService.editObj('3', { status: 'Проведен' }));
console.log("Проверяем изменения:", appointmentService.getObj('3'));

console.log("\n10. editObj(): попытка изменить несуществующий прием id='99' (ожидаем false):", appointmentService.editObj('99', { status: 'Ошибка' }));

console.log("\n11. removeObj(): удалить прием с id='7' (ожидаем true):", appointmentService.removeObj('7'));
console.log("Проверяем, что прием с id=7 удален:", appointmentService.getObj('7'));

console.log("\n12. removeObj(): попытка удалить несуществующий прием (ожидаем false):", appointmentService.removeObj('99'));



document.addEventListener('DOMContentLoaded', () => {

    const views = document.querySelectorAll('.view');
    const errorView = document.querySelector('#error-view');


    const showView = () => {
        const currentHash = window.location.hash || '#login-view';

        const targetView = document.querySelector(currentHash);

        views.forEach(view => {
            view.style.display = 'none';
        });

        if (targetView) {
            targetView.style.display = 'block';
        } else {
            if (errorView) {
                errorView.style.display = 'block';
            }
        }
    };


    window.addEventListener('hashchange', showView);
    showView();

});