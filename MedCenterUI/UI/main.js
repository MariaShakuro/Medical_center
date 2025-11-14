/*
 * Лабораторная работа №3: Основы JavaScript и классы.
 * Модель данных для ИС "МедЦентр".
 */

// =================================================================================================
// 1. ДАННЫЕ ПРИЛОЖЕНИЯ
// =================================================================================================

// В качестве основного объекта ObjInf из задания мы будем использовать "Прием" (Appointment),
// так как это центральная сущность в нашей системе.

// Для генерации данных создадим вспомогательные массивы имен.
const patientNames = ['Иванов И.И.', 'Петрова А.С.', 'Сидоров В.В.', 'Кузнецова О.П.', 'Михайлов Д.Е.', 'Васильева Е.А.', 'Новиков С.Н.', 'Морозова И.В.'];
const doctorNames = ['Петров П.П.', 'Смирнова Л.И.', 'Волков А.Б.', 'Зайцева М.Г.'];
const specializations = ['Терапевт', 'Невролог', 'Хирург', 'Окулист'];
const descriptions = [
    'Плановый осмотр', 'Острая боль', 'Консультация по результатам анализов',
    'Вторичный прием', 'Оформление справки', 'Процедура', 'Жалобы на самочувствие'
];
const statuses = ['Запланирован', 'Завершен', 'Отменен'];

// Генерируем массив приемов (наш ObjInf)
const appointments = [];
for (let i = 1; i <= 20; i++) {
    const creationDate = new Date(2025, 10, i, 10 + i, 30 * (i % 2), 0); // Ноябрь 2025
    const appointmentDate = new Date(creationDate.getTime() + 3 * 24 * 60 * 60 * 1000); // Прием через 3 дня после создания записи

    appointments.push({
        id: i.toString(),
        description: descriptions[i % descriptions.length],
        createdAt: creationDate,
        author: patientNames[i % patientNames.length], // Автор записи - пациент
        photoLink: null, // У приемов нет фото

        // -- Дополнительные поля согласно нашему заданию --
        patientId: (i % patientNames.length) + 1,
        doctorId: (i % doctorNames.length) + 1,
        appointmentDate: appointmentDate,
        status: statuses[i % statuses.length],
        specialization: specializations[i % specializations.length]
    });
}

console.log('Исходный массив данных (приемов):', appointments);


// =================================================================================================
// 2, 3, 4. КЛАСС ДЛЯ РАБОТЫ С КОЛЛЕКЦИЕЙ
// =================================================================================================

class AppointmentCollection {
    // Приватное поле для хранения массива приемов
    _appointments = [];

    // Конструктор, принимает начальный массив
    constructor(initialAppointments = []) {
        this.addAll(initialAppointments);
    }

    /**
     * Вспомогательный приватный метод для валидации объекта приема.
     * @param {Object} app - Объект приема.
     * @returns {boolean} - true, если объект валиден, иначе false.
     */
    _validateAppointment(app) {
        if (!app) return false;

        // Проверка обязательных полей
        const hasRequiredFields = app.id && app.description && app.createdAt && app.author &&
                                  app.patientId && app.doctorId && app.appointmentDate && app.status;
        if (!hasRequiredFields) {
            console.error('Ошибка валидации: отсутствуют обязательные поля.', app);
            return false;
        }

        // Проверка типов и форматов
        if (typeof app.id !== 'string' || app.id.length === 0) return false;
        if (typeof app.description !== 'string' || app.description.length >= 200) return false;
        if (!(app.createdAt instanceof Date)) return false;
        if (!(app.appointmentDate instanceof Date)) return false;
        if (typeof app.author !== 'string' || app.author.length === 0) return false;
        if (app.photoLink && typeof app.photoLink !== 'string') return false; // photoLink не обязателен

        return true;
    }

    /**
     * Получает отфильтрованный и отсортированный массив приемов с пагинацией.
     * @param {number} skip - Сколько элементов пропустить.
     * @param {number} top - Сколько элементов вернуть.
     * @param {Object} filterConfig - Объект для фильтрации.
     * @returns {Array<Object>} - Массив приемов.
     */
    getObjs(skip = 0, top = 10, filterConfig = {}) {
        // Начинаем с копии массива
        let result = [...this._appointments];

        // Фильтрация
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

        // Сортировка по дате создания (от новых к старым) по умолчанию
        result.sort((a, b) => b.createdAt - a.createdAt);

        // Пагинация
        return result.slice(skip, skip + top);
    }

    /**
     * Получает один прием по его ID.
     * @param {string} id - ID приема.
     * @returns {Object | undefined} - Найденный объект или undefined.
     */
    getObj(id) {
        if (typeof id !== 'string') return undefined;
        return this._appointments.find(app => app.id === id);
    }

    /**
     * Публичный метод для валидации.
     * @param {Object} app - Объект приема.
     * @returns {boolean}
     */
    validateObj(app) {
        return this._validateAppointment(app);
    }

    /**
     * Добавляет новый прием в коллекцию.
     * @param {Object} app - Новый прием.
     * @returns {boolean} - true в случае успеха, false в случае ошибки.
     */
    addObj(app) {
        // Проверяем на валидность и уникальность ID
        if (!this._validateAppointment(app) || this.getObj(app.id)) {
            return false;
        }
        this._appointments.push(app);
        return true;
    }

    /**
     * Редактирует существующий прием.
     * @param {string} id - ID приема для изменения.
     * @param {Object} changes - Объект с полями, которые нужно изменить.
     * @returns {boolean} - true в случае успеха, false в случае ошибки.
     */
    editObj(id, changes) {
        if (typeof id !== 'string' || !changes) return false;

        const index = this._appointments.findIndex(app => app.id === id);
        if (index === -1) {
            return false;
        }

        // Запрещаем менять id, author, createdAt
        delete changes.id;
        delete changes.author;
        delete changes.createdAt;

        // Создаем новый объект, объединяя старые данные с новыми
        const updatedAppointment = { ...this._appointments[index], ...changes };

        // Проверяем, остался ли объект валидным после изменений
        if (!this._validateAppointment(updatedAppointment)) {
            return false;
        }

        this._appointments[index] = updatedAppointment;
        return true;
    }

    /**
     * Удаляет прием по ID.
     * @param {string} id - ID приема для удаления.
     * @returns {boolean} - true в случае успеха, false если ID не найден.
     */
    removeObj(id) {
        if (typeof id !== 'string') return false;

        const index = this._appointments.findIndex(app => app.id === id);
        if (index === -1) {
            return false;
        }

        this._appointments.splice(index, 1);
        return true;
    }

    /**
     * Добавляет массив приемов в коллекцию.
     * @param {Array<Object>} apps - Массив приемов.
     * @returns {Array<Object>} - Массив успешно добавленных приемов.
     */
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

    /**
     * Очищает всю коллекцию.
     */
    clear() {
        this._appointments = [];
    }
}


// =================================================================================================
// 5. ПРОВЕРКА РАБОТЫ МЕТОДОВ В КОНСОЛИ
// =================================================================================================

// Для проверки создадим экземпляр нашего класса, передав в него сгенерированные данные
const appointmentService = new AppointmentCollection(appointments);

console.log("--- Проверка работы методов ---");

// --- getObjs ---
console.log("\n1. getObjs(): первые 5 приемов (по умолчанию 10)");
console.table(appointmentService.getObjs(0, 5));

console.log("\n2. getObjs(): следующие 5 приемов (пагинация)");
console.table(appointmentService.getObjs(5, 5));

console.log("\n3. getObjs(): фильтр по статусу 'Завершен'");
console.table(appointmentService.getObjs(0, 5, { status: 'Завершен' }));

console.log("\n4. getObjs(): фильтр по автору 'Иванов'");
console.table(appointmentService.getObjs(0, 5, { author: 'Иванов' }));

// --- getObj ---
console.log("\n5. getObj(): найти прием с id='5' (успешно)");
console.log(appointmentService.getObj('5'));

console.log("\n6. getObj(): найти прием с id='99' (неуспешно)");
console.log(appointmentService.getObj('99'));

// --- addObj ---
const newAppointmentValid = {
    id: '21', description: 'Новый тестовый прием', createdAt: new Date(), author: 'Тестов Т.Т.',
    patientId: 99, doctorId: 100, appointmentDate: new Date(), status: 'Запланирован', specialization: 'Терапевт'
};
console.log("\n7. addObj(): добавить валидный прием (ожидаем true):", appointmentService.addObj(newAppointmentValid));
console.log("Проверяем, что прием с id=21 появился:", appointmentService.getObj('21'));

const newAppointmentInvalid = { id: '22', description: 'Невалидный' }; // нет обязательных полей
console.log("\n8. addObj(): добавить невалидный прием (ожидаем false):", appointmentService.addObj(newAppointmentInvalid));

// --- editObj ---
console.log("\n9. editObj(): изменить статус у приема id='3' (ожидаем true):", appointmentService.editObj('3', { status: 'Проведен' }));
console.log("Проверяем изменения:", appointmentService.getObj('3'));

console.log("\n10. editObj(): попытка изменить несуществующий прием id='99' (ожидаем false):", appointmentService.editObj('99', { status: 'Ошибка' }));

// --- removeObj ---
console.log("\n11. removeObj(): удалить прием с id='7' (ожидаем true):", appointmentService.removeObj('7'));
console.log("Проверяем, что прием с id=7 удален:", appointmentService.getObj('7'));

console.log("\n12. removeObj(): попытка удалить несуществующий прием (ожидаем false):", appointmentService.removeObj('99'));


// =================================================================================================
// ЛОГИКА ОТОБРАЖЕНИЯ И НАВИГАЦИИ (НОВЫЙ КОД)
// =================================================================================================

// Ожидаем полной загрузки HTML-документа
document.addEventListener('DOMContentLoaded', () => {

    const views = document.querySelectorAll('.view');
    const errorView = document.querySelector('#error-view');

    // Функция, отвечающая за отображение нужного экрана
    const showView = () => {
        // Получаем хеш из адресной строки (например, "#login-view")
        // Если хеша нет, по умолчанию устанавливаем хеш для страницы входа
        const currentHash = window.location.hash || '#login-view';

        // Находим целевой элемент на странице по его ID
        const targetView = document.querySelector(currentHash);

        // Сначала скрываем абсолютно все экраны
        views.forEach(view => {
            view.style.display = 'none';
        });

        // Если элемент с нужным ID найден, показываем его
        if (targetView) {
            targetView.style.display = 'block';
        } else {
            // Если в URL указан несуществующий хеш, показываем страницу ошибки
            if (errorView) {
                errorView.style.display = 'block';
            }
        }
    };

    // Добавляем обработчик события 'hashchange'. Он будет срабатывать
    // каждый раз, когда меняется хеш в URL (например, при клике на ссылку).
    window.addEventListener('hashchange', showView);

    // Вызываем функцию один раз при первоначальной загрузке страницы,
    // чтобы показать экран, соответствующий URL, с которым зашел пользователь.
    showView();

});