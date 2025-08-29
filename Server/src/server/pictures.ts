export class DropDownOption {
    constructor(
        public index: number,
        public label: string,
        public value: string
    ) {}
}

export class DropDownControlData {
    constructor(
        public options: DropDownOption[],
        public selectedIndex: number,
        public disabled: boolean
    ) {}
}

export class PicturesNamespace {
    public static GET_PICTURE_SELECTOR: string = 'pictures:getSelector';
    public static UPDATE_PICTURE: string = 'pictures:updatePicture';

    private imageOptions: DropDownOption[] = [
        new DropDownOption(1, 'Audio', 'audio.png'),
        new DropDownOption(2, 'Boxer', 'boxer-4k30-main1.png'),
        new DropDownOption(3, 'CP4230', 'CP4230.png'),
        new DropDownOption(
            4,
            'LW551i',
            'Christie-LW551i-3LCD-digital-projector-main-image-4.png'
        ),
        new DropDownOption(5, 'MicroTiles LED', 'Christie-MicroTilesLED.jpg'),
        new DropDownOption(6, 'Q-Series-main', 'Q-Series-main.png'),
        new DropDownOption(7, 'Spyder X80', 'Christie_Spyder-X80-main1a.png'),
    ];

    private pictureSelector: DropDownControlData;

    constructor() {
        this.pictureSelector = new DropDownControlData(
            this.imageOptions,
            5,
            false
        );
    }

    public getPictureSelector() {
        return this.pictureSelector;
    }

    public setPictureSelectorEnabled(isEnabled: boolean) {
        this.pictureSelector.disabled = !isEnabled;
    }

    public setPictureSelected(selectedIndex: number) {
        if (
            selectedIndex >= 0 &&
            selectedIndex < this.pictureSelector.options.length
        ) {
            this.pictureSelector.selectedIndex = selectedIndex;
        } else {
            console.error('Attempted to select invalid image index');
        }
    }

    public getSelectedPicture() {
        return this.pictureSelector.options[this.pictureSelector.selectedIndex]
            .value;
    }
}
